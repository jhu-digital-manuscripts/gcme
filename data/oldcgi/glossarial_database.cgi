#! /usr/local/bin/perl

use CGI::Pretty qw(:all);
use Data::Dumper;

BEGIN {
   use CGI::Carp qw(carpout fatalsToBrowser);
   open LOG, ">>error.log" || die "Unable to open error.log: $!\n";
   carpout(LOG);
}

#################################################
#####             Define Global Variables and Constants
#####
$imagepath = "/~chaucer/tools/images";
$dir = ".";
$filename = "abbr2title.lut";
@author = ("Geoffrey Chaucer", "John Gower");
$target = "";
$text_data = {};
$poet = "";
$selected_text = "";
$FORM_ACTION = "/~chaucer/cgi-bin/glossarial_database.cgi";



#################################################
#####                MAIN                   #####
#################################################

##  Define the state of this transaction
$state = param('state');


## Evaluate the state and proceed appropriately
if ($state eq "subset") {
	## pop up a subset of the selected document
	&which_texts;
	%text_data = &read_file($dir, $filename);
	$list_html = &compose_subset_titles_html(%text_data);
	
	print header,
		start_html,
		start_form(-action=>$FORM_ACTION, 
				-method=>'POST', 
				-target=>'criteria'),
			hidden(-name=>'state', -value=>'addtexts'),
			hidden(-name=>'layer', -value=>'sub'),
			$list_html,
		end_form,
		end_html;
} else {
	## produce list of texts to be searched
	%text_data = &read_file($dir, $filename);
	$title_html = &compose_first_titles_html(%text_data);
	
	print header, 
		start_html,
		start_form(-action=>$FORM_ACTION, 
				-method=>'POST', 
				-target=>'criteria'),
			hidden(-name=>'state', -value=>'addtexts'),
			hidden(-name=>'layer', -value=>'top'),
			$title_html,
		end_form,
		end_html;
}



#################################################
#####               SUBROUTINES            	#####
#################################################


## subroutine reads in the file of titles and abbreviations that can be searched.
sub read_file {
	my ($dir, $filename) = @_;
	
	open TITLES, "<$dir/$filename"  
					|| die "can't open titles and abbreviations: $filename\n";
		while (<TITLES>) {
			chomp;
			# skip comments
			next if ($_ =~ /^##/ );			
			($keys, $data) = split /\-/, $_, 2;
			($key0, $key1, $key2, $key3) = split /\./, $keys;
			# load hashes
			$text_data{$author[$key0]}{$key1}{$key2}{$key3} = $data;
		}
	close TITLES;
	return %text_data;
}


## Load the titles and look-up codes into a series of hashes
sub which_texts {
	@main_texts = qw(CT Minor Bo Tr LGW Short Ast PNAtCitM WAtC CA Peace);
	$text_no = 0;
	
	foreach $i (@main_texts) {
		$checked = param("$i");
		if ($checked) {
			$selected_text = $text_no;
			last;
		}
		$text_no++;
	}
	if ( ($selected_text == 9) || ($selected_text == 10) ) {
		$poet = $author[1]; 		## i.e., John Gower
		$selected_text -= 9;
	} else {
		$poet = $author[0];		## i.e., Geoffrey Chaucer
	}
}


## subroutine creates the HTML for various subsets of Chaucer's and Gowers works.
## The user can then select a portion of the entire work to be searched.
sub compose_subset_titles_html {
	my (%text_data) = @_;
	
	autoEscape(undef);

	## create header for either Chaucer or Gower
	($abbrev, $title) = split /\,/, $text_data{$poet}{$selected_text}{0}{0}, 2;		
	my $list_html =  h3("$poet's " , em($title) );
	
	foreach $key0 (sort keys %{$text_data{$poet}{$selected_text}}) {
		my (@chvalues, %chlabels);
		##create checkboxes for texts
		foreach $key1 (sort keys %{$text_data{$poet}{$selected_text}{$key0}}) {
			## find appropriate title and abbreviation
			($abbrev, $title) = split /\,/, $text_data{$poet}{$selected_text}{$key0}{$key1}, 2;
			my $val = "$abbrev:$title";
			push @chvalues, $val;
			$chlabels{$val} = $title;
		 }
		$list_html .=  dd( checkbox_group(
						-name=>'newtexts',
						-values		=> \@chvalues,
						-linebreak	=> 'true',
						-labels		=> \%chlabels) );
	}
	
	autoEscape('yes');
	
	return $list_html;
}


## create the HTML for the first time in
## The user is presented with a list a of Chaucer's and Gower's works.
##  He or she can either select to have the entire work searched or click on the 
## magifying glass to select a portion of that work.
sub compose_first_titles_html {
	my (%text_data) = @_;
	my $list_html = '';
	autoEscape(undef);
		
	foreach my $auth (sort keys %text_data) {
		my (@chvalues, %chlabels);
		## create header for either Chaucer or Gower
		##create checkboxes for texts with selection icon for selecting a 
		## subset of the entire work
		foreach my $ttl (sort keys %{$text_data{$auth}}) {
			## find appropriate title and abbreviation
			($abbrev, $title) = split /\,/, $text_data{$auth}{$ttl}{0}{0}, 2;
# 			$title =~ s/\ /_/g;
			my $val = "$abbrev:$title";
			my $link = a({-href=>"$FORM_ACTION?state=subset&$abbrev=checked"},
							img({-src=>"$imagepath/closeup.gif", -border=>0}) ) . 
						"&nbsp;&nbsp;$title";
			push @chvalues, $val;
			$chlabels{$val} = $link;
			
		}
		
		$list_html .= p(b({-class=>'listtitle'}, $auth),
						b({-class=>'listsubtitle'}, '&nbsp;&nbsp;&nbsp;&nbsp;select',
							br, '&nbsp;all&nbsp;subset', br),
						checkbox_group(
							-name=>'newtexts',
							-values		=> \@chvalues,
							-linebreak	=> 'true',
							-labels		=> \%chlabels) );
	}
	
	autoEscape('yes');
	
	return $list_html;
}

1;
__END__