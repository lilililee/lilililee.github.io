$(function(){

	resetArgs();		//重置所有参数
	showArgsInfo();		//显示参数说明
	figureResult();		//计算结果
	fixedMenu();		//右侧固定菜单

})



//显示参数说明
function showArgsInfo(){
	$('.b-in li input').mouseenter(function(){
		$(this).nextAll('p').css('visibility','visible');
	});
	$('.b-in li input').mouseleave(function(){
		$(this).nextAll('p').css('visibility','hidden');
	});
}

//重置所有参数
function resetArgs(){
	//隐藏警告信息
	$('.b-in span').hide();
	//重置input参数
	$('.b-in input').val('');
	//隐藏结果
	$('.b-out .lost').hide();
	$('.b-out .test').hide();
}

//计算结果
function figureResult(){
	//点击重置按钮，重置参数
	$('.b-out .reset').click(function(){
		resetArgs();
	});

	//点击开始按钮，开始计算
	$('.b-out .start').click(function(){
		//先隐藏结果显示
		$('.b-out .lost').hide();
		$('.b-out .test').hide();

		var args = checkArgs();//获取参数
		if(typeof args == 'undefined'){
			return;
		}
		var buff = (args.buff*0.85)*8;	//将byte转为bit，并减去静态缓存
		// var cur_buff = buff;		//记录当前可用buffer
		// var discard = 0;				//丢包总数
		var in_width = args.rw*args.rn;		//入口总带宽
		var out_width = args.tw*args.tn;	//出口总带宽
		var max_Ts = out_width/1000;		//总入口每ms最大转发能力，单位为 M/ms
		var all_flow = args.rs*args.rn;			//1000ms内进入总流量
		
		//根据不稳定指数a计算出入口最快转发时间t(ms)，以及入口平均速率Rv(M/ms)，
		var min_t = 1000-10*args.point*(1-args.rs/args.rw);
		var Rv =  all_flow/min_t;

		//a = (1000-t)/(1000-rs/rw*1000) * 100
		//t = rs*rn / r实际

		//document.write(t+'____________________'+Rv);
		var all_Rs = [];
		for(var t=0;t<min_t;t++){
			all_Rs[t] = Rv;
		}
		//document.write(t+'---------');
		for(;t<1000;t++){
			all_Rs[t] = 0;
		}
	
		//document.writeln((discard/all_flow).toFixed(2)+'%');
		var result = figure(all_Rs);
		//$('.b-out h2').html('测试结果');
		//$('.b-out .lost').html('丢包率：'+result+'%');
		//$('.b-out .lost-result').fadeOut(0).html('丢包率：'+result+'%').fadeIn(1000);
		$('.b-out .lost-result').html('丢包率：'+result+'%');
		$('.b-out .lost').fadeIn(1000);


		setTimeout(function(){		
			//根据计算结果，做出不同的评价
			if(all_flow>out_width){
				showAss('流量太大，加点带宽吧...');
			}else if(in_width<=out_width){
				showAss('绝对可行的方案，够稳！');
			}else if(args.point == 0 && result > 0){
				showAss('这这这...肯定不行！');
			}else if(args.point == 0 && result == 0){
				showAss('咱们应该继续测下~');
			}else if(args.point == 100 && result > 0){
				showAss('或许流量没这么不稳定？');
			}else if(args.point == 100 && result == 0){
				showAss('没毛病，放心用！zzz');
			}else if(result >0){
				showAss('千万别慌！下面有方案！');
			}else{
				showAss('咦，这个可以哟~');
			}

			$('.b-out .test').fadeIn(1000);

			function showAss(info){
				$('.test-assessment').html(info);		
			}
			
		},500);
		

		//获取每ms的速率后开始计算
		function figure(all_Rs){
			var cur_buff = buff;			//记录当前可用buffer
			var discard = 0;				//丢包总数

			for(t=0;t<1000;t++){			
				if(all_Rs[t] > max_Ts){
					if(cur_buff <= 0){
						discard += (all_Rs[t]-max_Ts);
					}else{
						cur_buff -= (all_Rs[t]-max_Ts);
						if(cur_buff < 0){
							discard += (-cur_buff);
							cur_buff = 0;
						}
					}						
				}else{
					
					cur_buff += (max_Ts - all_Rs[t]);
					if(cur_buff > buff){
						cur_buff = buff;
					}
				}
				
			}

			return (discard/all_flow*100).toFixed(2);
		}
	});
}

//检查参数合法性
function checkArgs(){

	$('.b-in span').hide();

	var check_result = true;
	//入口速率
	//alert(NaN < 0);
	var rs = $('.b-in #Rs').val()*1;
	if(rs==0 || !(/^\d*\.?\d+$/.test(rs))){
		showAlarm('Rs');
	}

	//入口带宽
	var rw = $('.b-in #Rw').val()*1;
	if(rw<rs || !(/^10{1,4}$/.test(rw))){
		//$('.b-in #Rw').nextAll('span').show();
		showAlarm('Rw');
	}

	//入口数目
	var rn = $('.b-in #Rn').val()*1;
	if(rn==0 || !(/^\d*$/.test(rn))){
		//$('.b-in #Rn').nextAll('span').show();
		showAlarm('Rn');
	}

	//出口带宽
	var tw = $('.b-in #Tw').val()*1;
	if(!(/^10{1,4}$/.test(tw))){
		//$('.b-in #Tw').nextAll('span').show();
		showAlarm('Tw');
	}

	//出口数目
	var tn = $('.b-in #Tn').val()*1;
	if(tn==0 || !(/^\d*$/.test(tn))){
		//$('.b-in #Tn').nextAll('span').show();
		showAlarm('Tn');
	}

	//缓存
	var buff = $('.b-in #Buff').val();
	if(buff=='' || !(/^\d*\.?\d+$/.test(buff))){
		//$('.b-in #Buff').nextAll('span').show();
		showAlarm('Buff');
	}
	//不稳定指数
	var point = $('.b-in #Point').val();
	if(point=='' || (point!=100 && !(/^\d{1,2}$/.test(point)))){
		//$('.b-in #Point').nextAll('span').show();
		showAlarm('Point');
	}
	

	function showAlarm(ele_id){
		$('.b-in #'+ele_id).nextAll('span').show();
		check_result = false;
	}

	if(check_result){
		return {
			rs : rs,
			rw : rw,
			rn : rn,
			tw : tw,
			tn : tn,
			buff : buff,
			point : point
		}
	}
}


//右侧固定菜单
function fixedMenu(){
		//显示和隐藏固定菜单栏	
		function showFixedMenu(){		
			var flag = true;
			$(window).scroll(function(){
				//console.log($(this).scrollTop());
				if(($(window).scrollTop() > 400)){
					$('#fix-menu').fadeIn(200);
				}else{
					$('#fix-menu').fadeOut(200);
				}
			});
		}
		showFixedMenu();

		//关闭/打开箭头动画
		function togglePoint(){
			$('#fix-menu li').eq(0).click(function(){
				//切换箭头效果
				$('#canvas').fadeToggle();
				//切换图标
				$('#fix-menu .icon-cuowu').fadeToggle(500);
			});
		}
		togglePoint();

		//显示二维码
		function showErweima(){
			$('#fix-menu .icon-weichat').mouseover(function(){
				$('.bdcom').show();
			});
			$('#fix-menu .icon-weichat').mouseout(function(){
				$('.bdcom').hide();
			});
		}
		showErweima();

		//回到顶部
		function toTop(){
			$('.to-top').click(function(){
				$('html,body').animate({scrollTop:0},500);
			});
		}
		toTop();
	}